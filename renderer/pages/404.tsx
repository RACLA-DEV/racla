import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import axios, { AxiosResponse } from 'axios'
import { IUserNameRequest, IUserNameResponse } from '@/types/IUserName'
import { useRouter } from 'next/router'
import { useParams } from 'next/navigation'

export default function NotFoundPage({ userData }) {
  const router = useRouter()

  useEffect(() => {
    router.push('/')
  }, [])

  return <></>
}
